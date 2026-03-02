import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="not-found-link">
        Back to Calculator
      </Link>
    </div>
  );
}
