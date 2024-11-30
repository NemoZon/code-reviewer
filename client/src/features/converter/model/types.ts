export type Json = {
  file: string;
  score: number;
  issues: string[];
  // issues: [
  //   {
  //     type: string;
  //     criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  //     location: string;
  //     description: string;
  //     suggestion: string;
  //   },
  // ];
};
