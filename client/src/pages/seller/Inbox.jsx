import { useNavigate, useParams } from 'react-router-dom';
import ChatView from '../../components/ChatView';

export default function Inbox() {
  const { id } = useParams();
  const nav = useNavigate();
  return (
    <ChatView as="shop" activeId={id} basePath="/seller/inbox" onSelect={cid => nav(`/seller/inbox/${cid}`)} />
  );
}
