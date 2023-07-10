import { Configuration, OpenAIApi } from 'openai'
import { levenshteinDistance } from '../utils.js' // Import the Levenshtein distance function

const configuration = new Configuration({
  apiKey: process.env.chatGPT_API_KEY,
})
const openai = new OpenAIApi(configuration)

const qaData = [
  {
    question: 'How do I create an account?',
    answer:
      "To create an account, click on the 'Sign Up' button on the homepage and fill out the required information.",
  },
  {
    question: 'How can I list my items for sale?',
    answer:
      'To list your items for sale, log in to your account, go to the "Sell" section, and follow the instructions to create a listing.',
  },
  {
    question: 'What payment methods are supported?',
    answer:
      'We support various payment methods, including credit/debit cards, PayPal, and bank transfers. You can choose your preferred payment option during the checkout process.',
  },
  {
    question: 'How does the transaction process work?',
    answer:
      'Once a buyer purchases your item, you will receive a notification. You can then arrange the details of the transaction, such as shipping the item and confirming payment. We recommend using our built-in messaging system to communicate with the buyer.',
  },
  {
    question: 'Are there any fees for selling items?',
    answer:
      "Yes, there is a small fee for selling items on our platform. The fee is a percentage of the item's selling price and helps cover the costs of maintaining the marketplace.",
  },
]
export async function sendMessageChatGPT(req, res) {
  const userQuestion = req.body.message
  let generatedMessage = ''

  const matchingQuestion = qaData.find(
    (qa) =>
      levenshteinDistance(
        userQuestion.toLowerCase(),
        qa.question.toLowerCase()
      ) <= 3
  )

  if (matchingQuestion) {
    generatedMessage = {
      role: 'assistant',
      content: matchingQuestion.answer,
    }
  } else {
    try {
      const chatCompletion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: req.body.message }],
        temperature: 1,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })
      generatedMessage = chatCompletion.data.choices[0].message
    } catch (err) {
      console.error('Error:', err)
      res.status(500).send({ message: err })
      return
    }
  }

  res.status(200).send(generatedMessage)
}
