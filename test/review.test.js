const review = require('../src/lib/review');
jest.mock('../src/lib/utils');
const { getChangedFiles: getChangedFilesMock } = require('../src/lib/utils');

const reviewers = { default: ['default1', 'default2', 'login'], review: [{ paths: ['test/**', 'cmd/**'], reviewers: ['rw-a', 'rw-b'] }, { paths: ['packg/**'], reviewers: ['rw-c', 'rw-d'] }, { paths: ['packg2/**'], reviewers: ['rw-e', 'login'] }] };

test('askToReview default reviewers', async () => {
  // Arrange
  const context = createContext(reviewers);
  getChangedFilesMock.mockImplementationOnce(cntxt => cntxt === context ? ['otherfolder/file-a'] : undefined);
  // Act
  await review.askToReview(context);
  // Assert
  expect(context.issue.mock.calls.length).toBe(1);
  expect(context.issue.mock.calls[0][0]).toStrictEqual({ 'reviewers': ['default1', 'default2'] });
  expect(context.github.pulls.createReviewRequest.mock.calls.length).toBe(1);
  expect(context.github.pulls.createReviewRequest.mock.calls[0][0]).toStrictEqual('issue');
});

test('askToReview reviewer one file existing in path but the other', async () => {
  // Arrange
  const context = createContext(reviewers);
  getChangedFilesMock.mockImplementationOnce(cntxt => cntxt === context ? ['test/file-a', 'filex'] : undefined);
  // Act
  await review.askToReview(context);
  // Assert
  expect(context.issue.mock.calls.length).toBe(1);
  expect(context.issue.mock.calls[0][0]).toStrictEqual({ 'reviewers': ['default1', 'default2', 'rw-a', 'rw-b'] });
  expect(context.github.pulls.createReviewRequest.mock.calls.length).toBe(1);
  expect(context.github.pulls.createReviewRequest.mock.calls[0][0]).toStrictEqual('issue');
});

test('askToReview reviewer both files existing in path ', async () => {
  // Arrange
  const context = createContext(reviewers);
  getChangedFilesMock.mockImplementationOnce(cntxt => cntxt === context ? ['test/file-a', 'cmd/filex'] : undefined);
  // Act
  await review.askToReview(context);
  // Assert
  expect(context.issue.mock.calls.length).toBe(1);
  expect(context.issue.mock.calls[0][0]).toStrictEqual({ 'reviewers': ['default1', 'default2', 'rw-a', 'rw-b'] });
  expect(context.github.pulls.createReviewRequest.mock.calls.length).toBe(1);
  expect(context.github.pulls.createReviewRequest.mock.calls[0][0]).toStrictEqual('issue');
});

test('askToReview reviewer both files existing in different paths', async () => {
  // Arrange
  const context = createContext(reviewers);
  getChangedFilesMock.mockImplementationOnce(cntxt => cntxt === context ? ['test/file-a', 'packg/filex'] : undefined);
  // Act
  await review.askToReview(context);
  // Assert
  expect(context.issue.mock.calls.length).toBe(1);
  expect(context.issue.mock.calls[0][0]).toStrictEqual({ 'reviewers': ['default1', 'default2', 'rw-a', 'rw-b', 'rw-c', 'rw-d'] });
  expect(context.github.pulls.createReviewRequest.mock.calls.length).toBe(1);
  expect(context.github.pulls.createReviewRequest.mock.calls[0][0]).toStrictEqual('issue');
});

test('askToReview reviewer login', async () => {
  // Arrange
  const context = createContext(reviewers);
  getChangedFilesMock.mockImplementationOnce(cntxt => cntxt === context ? ['packg2/filex'] : undefined);
  // Act
  await review.askToReview(context);
  // Assert
  expect(context.issue.mock.calls.length).toBe(1);
  expect(context.issue.mock.calls[0][0]).toStrictEqual({ 'reviewers': ['default1', 'default2', 'rw-e'] });
  expect(context.github.pulls.createReviewRequest.mock.calls.length).toBe(1);
  expect(context.github.pulls.createReviewRequest.mock.calls[0][0]).toStrictEqual('issue');
});

function createContext(reviewers) {
  return { config: jest.fn(path => path === 'bot-files/reviewers.yml' ? reviewers : undefined), github: { pulls: { createReviewRequest: jest.fn(() => 'toreview') } }, issue: jest.fn(() => 'issue'), payload: { pull_request: { user: { login: 'login' } } } };
}
