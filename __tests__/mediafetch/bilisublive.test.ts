import fetcher from '@utils/mediafetch/bilisublive';

test('bilisubLive', async () => {
  const content = await fetcher.regexFetch({
    reExtracted: ['', '3493085134719196'],
  });
  expect(content).not.toBeNull();
}, 250000);
