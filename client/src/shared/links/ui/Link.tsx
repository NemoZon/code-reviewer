import { NavLink } from 'react-router';

interface ILink {
  to: string;
  children: string | string[];
  state?: object;
}

export default function Link({ to, children, state }: ILink) {
  return (
    <NavLink to={to} state={state}>
      {children}
    </NavLink>
  );
}
