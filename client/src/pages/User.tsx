import { useParams } from 'react-router';
import { Title } from '../shared/text';
import { FileTreePage } from '../features/file-picker/ui/FileTreePage';

export default function User() {
  const { name } = useParams();

  return <>
    <Title>User {name || ''}</Title>
    <FileTreePage />
  </>
}
