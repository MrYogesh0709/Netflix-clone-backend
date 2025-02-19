/* eslint-disable react/prop-types */
import CheckoutPage from './Checkout';
import MoviePage from './MoviePage';
import Home from './Home';
import { BrowserRouter, Routes, Route } from 'react-router';
const movieId = '67ad058695dc70c7c1bef050';
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkout-page" element={<CheckoutPage />} />
        <Route path="/movie" element={<MoviePage movieId={movieId} />} />
        <Route path="/subscription-success" element={<div>subscription success</div>} />
        <Route path="/subscription-cancel" element={<div>subscription cancel</div>} />
        <Route
          path="*"
          element={
            <div>
              <h1>page not found</h1>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
