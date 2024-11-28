import { NavLink } from 'react-router';

interface ILink {
  to: string;
  children: string | string[];
}

export default function Link({ to, children }: ILink) {
  return <NavLink to={to}>{children}</NavLink>;
}
