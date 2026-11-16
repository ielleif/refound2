import { Link } from 'react-router-dom';
import { Empty } from '../components/Common';

export default function NotFound() {
  return (
    <div className="container section">
      <Empty title="This page was discontinued" action={<Link to="/" className="btn">Back to the homepage</Link>}>
        Like your favourite childhood snack, it's not around anymore.
      </Empty>
    </div>
  );
}
