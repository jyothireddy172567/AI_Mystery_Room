import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Investigation from './Investigation.jsx';
import { getMystery, getResult, submitAccusation } from '../../services/api.js';

vi.mock('../../services/api.js', () => ({
  getMystery: vi.fn(),
  getResult: vi.fn(),
  submitAccusation: vi.fn(),
}));

const caseData = {
  caseId: '507f1f77bcf86cd799439011', title: 'The Quiet Archive', summary: 'A ledger disappeared from a locked archive.',
  setting: 'North Gallery', difficulty: 'medium', suspects: [
    { id: 's1', name: 'Mara Voss', occupation: 'Curator', motive: 'Protect the collection.' },
    { id: 's2', name: 'Eli Rowan', occupation: 'Archivist', motive: 'Recover an old record.' },
  ],
  evidence: [{ id: 'e1', type: 'image', title: 'The darkened gallery', description: 'A fictional museum gallery.', timestamp: '22:45', assetStatus: 'ready', assetUrl: '/api/v1/mysteries/507f1f77bcf86cd799439011/evidence/e1/image', relatedSuspectIds: [] }],
};
const savedResult = { resultId: 'result-1', isCorrect: true, selectedSuspectId: 's2', score: 150, solution: {} };

function renderRoute() {
  return render(<MemoryRouter initialEntries={[`/case/${caseData.caseId}`]}><Routes>
    <Route path="/case/:caseId" element={<Investigation/>}/>
    <Route path="/case/:caseId/results" element={<div>Saved results screen</div>}/>
  </Routes></MemoryRouter>);
}

beforeEach(() => {
  getMystery.mockResolvedValue(caseData);
  getResult.mockRejectedValue(Object.assign(new Error('No accusation yet.'), { code: 'CASE_NOT_READY' }));
  submitAccusation.mockResolvedValue(savedResult);
});

describe('investigation accusation and evidence flow', () => {
  it('shows the generated evidence image and falls back when the image request fails', async () => {
    renderRoute();
    const image = await screen.findByRole('img', { name: /darkened gallery/i });
    expect(image).toHaveAttribute('src', caseData.evidence[0].assetUrl);
    fireEvent.error(image);
    expect(await screen.findByText(/image could not load/i)).toBeInTheDocument();
  });

  it('locks double-click submissions and opens the accepted result', async () => {
    renderRoute();
    fireEvent.click(await screen.findByRole('button', { name: /eli rowan/i }));
    const submit = screen.getByRole('button', { name: /submit accusation/i });
    fireEvent.click(submit);
    fireEvent.click(submit);
    await screen.findByText('Saved results screen');
    expect(submitAccusation).toHaveBeenCalledTimes(1);
    expect(submitAccusation).toHaveBeenCalledWith(caseData.caseId, 's2');
  });

  it('routes an already-submitted conflict to the original saved result', async () => {
    submitAccusation.mockRejectedValueOnce(Object.assign(new Error('Already submitted.'), { code: 'ALREADY_SUBMITTED' }));
    getResult.mockRejectedValueOnce(Object.assign(new Error('No accusation yet.'), { code: 'CASE_NOT_READY' })).mockResolvedValueOnce(savedResult);
    renderRoute();
    fireEvent.click(await screen.findByRole('button', { name: /mara voss/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit accusation/i }));
    await waitFor(() => expect(getResult).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Saved results screen')).toBeInTheDocument();
  });

  it('shows the saved result action when returning to an accused case', async () => {
    getResult.mockResolvedValueOnce(savedResult);
    renderRoute();
    expect(await screen.findByRole('link', { name: /view saved result/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eli rowan/i })).toBeDisabled();
    expect(submitAccusation).not.toHaveBeenCalled();
  });
});
