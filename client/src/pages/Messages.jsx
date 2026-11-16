import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ChatView from '../components/ChatView';

export default function Messages() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  return (
    <div className="container section">
      <ChatView as="buyer" activeId={id} basePath="/messages"
        attachProductId={params.get('product')}
        onSelect={cid => nav(`/messages/${cid}`)} />
    </div>
  );
}
