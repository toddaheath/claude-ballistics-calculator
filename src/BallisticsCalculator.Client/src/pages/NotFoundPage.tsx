import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page-header" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="nav-link" style={{ display: 'inline-block', marginTop: '1rem' }}>
        Back to Calculator
      </Link>
    </div>
  );
}
