import { NavLink } from 'react-router';

interface ILink {
  to: string;
  children: string | string[];
  state?: object;
  target?: string
}

export default function Link({ to, children, state, target }: ILink) {
  return (
    <NavLink to={to} state={state} target={target}>
      {children}
    </NavLink>
  );
}
