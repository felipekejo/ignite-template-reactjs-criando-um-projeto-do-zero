import { useUtterances } from '../../hooks/useUtterances';

const commentNodeId = 'comments';

export default function Comments() {
  useUtterances(commentNodeId);
  return <div id={commentNodeId} />;
}
