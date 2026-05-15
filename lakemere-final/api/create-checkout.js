const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  weekend: { label: 'Lake Mere Hire — Weekend Break (2 nights)', amount: 25000 },
  midweek: { label: 'Lake Mere Hire — Midweek Escape (4 nights)', amount: 35000 },
  week:    { label: 'Lake Mere Hire — Full Week (7 nights)', amount: 55000 },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { plan, checkin, checkout, guests, name, email, phone, notes } = req.body;
  if (!PLANS[plan] || !email || !checkin || !checkout) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'gbp',
          unit_amount: PLANS[plan].amount,
          product_data: {
            name: PLANS[plan].label,
            description: `Check-in: ${checkin} | Check-out: ${checkout} | Guests: ${guests}`,
          },
        },
        quantity: 1,
      }],
      metadata: { plan, checkin, checkout, guests, name, email, phone, notes: notes || '' },
      success_url: `${process.env.BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/#booking`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
