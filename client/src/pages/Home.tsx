import Link from '../shared/links/ui/Link';
import { Title } from '../shared/text';

export default function Home() {
  return (
    <div>
      <Title>Welcome home</Title>
      <Link to="/user/test">User Test</Link>
    </div>
  );
}
