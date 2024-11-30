export enum Criticality {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export type Json = {
  file: string;
  score: number;
  issues: string[];
  // issues: [
  //   {
  //     type: string;
  //     criticality: Criticality;
  //     location: string;
  //     description: string;
  //     suggestion: string;
  //   },
  // ];
};
