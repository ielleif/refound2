import { Link } from 'react-router-dom';
import { Logo } from './Common';
import { Squiggle } from './Deco';
import { showDisclaimer } from './Disclaimer';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-watermark" aria-hidden>re:found</div>
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="footer-note">Find your Pinoy nostalgia here. A mock marketplace for discontinued Filipino products and collectibles.</p>
          <p className="footer-mock">
            Mock e-commerce project. Nothing here is actually for sale and no real payments are processed.{' '}
            <button type="button" className="link-btn footer-mock-link" onClick={showDisclaimer}>About this demo</button>
          </p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/shop?category=toys">Toys &amp; Action Figures</Link>
          <Link to="/shop?category=fastfood">Fast-Food Collectibles</Link>
          <Link to="/shop?category=gadgets">Gadgets &amp; Radios</Link>
          <Link to="/shop?category=print">Komiks &amp; Posters</Link>
          <Link to="/shop?category=currency">Coins &amp; Stamps</Link>
          <Link to="/shop?category=heritage">Antiques &amp; Heritage</Link>
        </div>
        <div>
          <h4>Sell</h4>
          <Link to="/sell">Open a shop</Link>
          <Link to="/seller">Seller Studio</Link>
          <Link to="/sellers">Browse sellers</Link>
        </div>
        <div>
          <h4>re:found</h4>
          <Link to="/about">About us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/orders">Track an order</Link>
          <Link to="/#lookbook">Lookbook</Link>
        </div>
        <Squiggle className="footer-squiggle" color="#C8321F" />
      </div>
      <div className="footer-base container">
        <span>© {new Date().getFullYear()} re:found PH · A student/portfolio project</span>
        <span>Product images © their respective owners. Used for educational purposes only.</span>
      </div>
    </footer>
  );
}
