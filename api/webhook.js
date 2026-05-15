const Stripe = require('stripe');
const { Resend } = require('resend');
const { google } = require('googleapis');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { plan, checkin, checkout, guests, name, email, phone, notes } = session.metadata;
    const amount = (session.amount_total / 100).toFixed(2);

    // Email to guest
    await resend.emails.send({
      from: 'Lake Mere Hire <bookings@lakemerehire.co.uk>',
      to: email,
      subject: '🏡 Your Lake Mere Hire booking is confirmed!',
      html: `
        <div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#1a1f1c">
          <div style="background:#2c4a3e;padding:2rem 3rem;text-align:center">
            <h1 style="color:#fff;font-size:1.8rem;margin:0">Lake Mere Hire</h1>
          </div>
          <div style="padding:2.5rem 3rem;background:#fdfcfa">
            <h2 style="font-size:1.5rem;color:#2c4a3e;margin-bottom:0.5rem">Booking Confirmed ✓</h2>
            <p style="color:#4a5e55;line-height:1.8;margin-bottom:1.5rem">Hi ${name || 'there'}, we're delighted to confirm your booking at Lake Mere Hire. We look forward to welcoming you!</p>
            <table style="width:100%;font-size:0.9rem;border-collapse:collapse">
              <tr style="border-bottom:1px solid #e8dfd0"><td style="padding:0.6rem 0;color:#999">Check-in</td><td style="font-weight:600">${checkin}</td></tr>
              <tr style="border-bottom:1px solid #e8dfd0"><td style="padding:0.6rem 0;color:#999">Check-out</td><td style="font-weight:600">${checkout}</td></tr>
              <tr style="border-bottom:1px solid #e8dfd0"><td style="padding:0.6rem 0;color:#999">Guests</td><td style="font-weight:600">${guests}</td></tr>
              <tr style="border-bottom:1px solid #e8dfd0"><td style="padding:0.6rem 0;color:#999">Amount Paid</td><td style="font-weight:600;color:#b8935a">£${amount}</td></tr>
            </table>
            ${notes ? `<p style="margin-top:1.2rem;color:#888;font-size:0.85rem;font-style:italic">Your notes: ${notes}</p>` : ''}
            <p style="margin-top:2rem;color:#4a5e55;line-height:1.8">If you have any questions before your stay, simply reply to this email and we'll be happy to help.</p>
            <p style="margin-top:1.5rem;color:#b8935a;font-family:Georgia,serif;font-size:1.1rem;font-style:italic">— The Lake Mere Team</p>
          </div>
          <div style="background:#f7f3ed;padding:1rem 3rem;text-align:center;font-size:0.75rem;color:#aaa">
            lakemerehire.co.uk
          </div>
        </div>
      `,
    });

    // Email to owner
    await resend.emails.send({
      from: 'Lake Mere Bookings <bookings@lakemerehire.co.uk>',
      to: process.env.OWNER_EMAIL,
      subject: `💰 New booking: ${name} — ${checkin} to ${checkout}`,
      html: `<h2>New paid booking!</h2><ul><li>Name: ${name}</li><li>Email: ${email}</li><li>Phone: ${phone}</li><li>Check-in: ${checkin}</li><li>Check-out: ${checkout}</li><li>Guests: ${guests}</li><li>Plan: ${plan}</li><li>Amount: £${amount}</li><li>Notes: ${notes || '—'}</li></ul>`,
    });

    // Google Calendar
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      const cal = google.calendar({ version: 'v3', auth });
      await cal.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        requestBody: {
          summary: `🏡 Lake Mere — ${name}`,
          description: `Guests: ${guests} | Plan: ${plan} | Paid: £${amount} | Phone: ${phone} | Notes: ${notes || '—'}`,
          start: { date: checkin },
          end: { date: checkout },
          colorId: '2',
        },
      });
    } catch (calErr) {
      console.error('Calendar error:', calErr.message);
    }
  }
  res.json({ received: true });
};

module.exports.config = { api: { bodyParser: false } };
