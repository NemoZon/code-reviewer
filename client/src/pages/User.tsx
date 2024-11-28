import { useParams } from 'react-router';
import { Title } from '../shared/text';

export default function User() {
  const { name } = useParams();

  return <Title>User {name || ''}</Title>;
}
