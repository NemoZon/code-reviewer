import styled from 'styled-components';

interface ITitle {
  children: string | string[];
}

export function Title({ children }: ITitle) {
  return <H1>{children}</H1>;
}

const H1 = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: #bf4f74;
`;
