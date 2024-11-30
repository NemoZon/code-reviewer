import { Link, useLocation } from 'react-router';
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
        <Link to="/">{'<= '}Вернуться назад</Link>
        <Title>Отчет о файле</Title>
      </nav>
      <Preview file={file} />
    </div>
  );
}
