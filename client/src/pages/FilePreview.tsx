import { useLocation } from 'react-router';
import Preview from '../features/converter/ui/Preview';
import { Title } from '../shared/text';

export default function FilePreview() {
  const location = useLocation();
  const file = location.state;
  return (
    <div>
      <nav
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 30,
        }}
      >
        <Title>Отчет о файле</Title>
      </nav>
      <div style={{ justifyContent: 'center', display: 'flex' }}>
        <Preview file={file} />
      </div>
    </div>
  );
}
