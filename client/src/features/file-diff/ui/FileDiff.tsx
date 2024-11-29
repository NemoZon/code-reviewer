import React from 'react';
import { Card } from 'antd';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FileDiffProps {
  oldValue: string;
  newValue: string;
  language: string;
}

export const FileDiff: React.FC<FileDiffProps> = ({ oldValue, newValue, language }) => {
  const syntaxHighlight = (str: string) => (
    <SyntaxHighlighter language={language} style={coy}>
      {str}
    </SyntaxHighlighter>
  );

  return (
    <Card>
      <ReactDiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView={true}
        compareMethod={DiffMethod.LINES}
        renderContent={syntaxHighlight}
      />
    </Card>
  );
};
