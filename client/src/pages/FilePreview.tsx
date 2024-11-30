import { Link, useLocation } from 'react-router';
import Preview from '../features/converter/ui/Preview';
import { Title } from '../shared/text';

export default function FilePreview() {
  const location = useLocation();
  const file = location.state;
  return (
    <div>
      <Title>Отчет о файле</Title>
      <Link to="/">User Test</Link>
      <Preview file={file} />
    </div>
  );
}
