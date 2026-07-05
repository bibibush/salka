import { createBrowserRouter } from 'react-router';

import { AnalyzePage } from '@/pages/analyze';
import { ResultPage } from '@/pages/result';

export const router = createBrowserRouter([
  { path: '/', element: <AnalyzePage /> },
  { path: '/result', element: <ResultPage /> },
]);
