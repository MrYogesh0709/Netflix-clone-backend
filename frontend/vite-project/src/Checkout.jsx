import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLIC_KEY =
  'pk_test_51QtTZ5SFjKn66iIoSkusFqcstQ3dDHOjjtwnhspHB4ykOpo4j5zcljafz1VDBE0p4vFRnHcutCJyQvXxnq02YlT5006xS4DpiL';

const CheckoutPage = () => {
  // State to keep track of the selected plan
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  // Stripe instance initialization
  const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handleCheckout = async () => {
    if (!selectedPlan) {
      alert('Please select a plan!');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Call the backend to create the checkout session
      const response = await fetch('http://localhost:3000/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          customerEmail: 'yogeshvanzara98@gmail.com',
        }),
      });
      console.log(response);
      const { sessionId } = await response.json();

      // Step 2: Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (error) {
        console.error('Error during Stripe Checkout:', error);
        alert('Error during checkout!');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('An error occurred while initiating the checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Choose Your Plan</h1>

      {/* Display available plans */}
      <div>
        <button onClick={() => handlePlanSelect({ id: '67b3473095dc70c7c1bf76a2', name: 'Basic', price: 199 })}>
          Basic Plan - 199/month
        </button>
        <button onClick={() => handlePlanSelect({ id: 'plan-id-2', name: 'Premium Plan', price: 20 })}>
          Premium Plan - $20/month
        </button>
        <button onClick={() => handlePlanSelect({ id: 'plan-id-3', name: 'Ultimate Plan', price: 30 })}>
          Ultimate Plan - $30/month
        </button>
      </div>

      {/* Show selected plan */}
      {selectedPlan && (
        <div>
          <h2>Selected Plan: {selectedPlan.name}</h2>
          <p>Price: ${selectedPlan.price}/month</p>
        </div>
      )}

      {/* Checkout Button */}
      <button onClick={handleCheckout} disabled={loading}>
        {loading ? 'Loading...' : 'Proceed to Checkout'}
      </button>
    </div>
  );
};

export default CheckoutPage;
