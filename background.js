chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.action !== 'getOverview') return;

  chrome.storage.sync.get(['OPENAI_API_KEY', 'MODEL'], async data => {
    const openaiKey = data.OPENAI_API_KEY;
    const model = data.MODEL || 'gpt-4.1-nano';

    if (!openaiKey) {
      return sendResponse('⚠️ Please set your OpenAI API key in the extension options.');
    }

    const promptMessages = [
      {
        role: 'system',
        content: 'You are a research assistant. First, give a direct, concise answer to the user’s query. Then follow up with a structured Markdown overview including a summary, elaboration, conclusion, and related queries.'
      },
      {
        role: 'user',
        content: `Answer this question directly and then give a detailed Markdown-formatted explanation:\n\n"${msg.query}"\n\nRespond in this structure:\n\n**Answer:**\n[A direct 1–3 sentence answer.]\n\n---\n\n## Summary\n[1 paragraph summary]\n\n## Elaboration\n### Section 1 Title\n[Paragraph]\n\n### Section 2 Title\n[Paragraph]\n\n### Section 3 Title\n[Paragraph]\n\n## Conclusion\n[Wrap-up paragraph.]\n\n## Related Queries\n- [related query 1]\n- [related query 2]\n- [related query 3]`
      }
    ];

    try {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model,
          messages: promptMessages,
          temperature: 0.7,
          max_tokens: 800
        })
      });

      const aiJson = await aiRes.json();
      let aiAnswer = aiJson.choices?.[0]?.message?.content || 'No response from OpenAI.';

      // Append a footer about the model used
      aiAnswer += `\n\n---\n<sub><i>Response generated using <code>${model}</code></i><span class="bullet-separator"> • </span><button class="regenerate-btn">Regenerate</button></sub>`;

      sendResponse(aiAnswer);

    } catch (error) {
      console.error('❌ OpenAI fetch failed:', error);
      sendResponse('❌ Error: ' + error.message);
    }
  });

  return true;
});
