import Mustache from 'mustache'
import NodeMailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

type Variables = Record<string, unknown>

export type Mailer = {
  send(to: string, templateName: string, variables: Variables): Promise<unknown>
}

const baseUrl =
  process.env.BASEURL || 'http://localhost:' + (process.env.PORT || 8200)
const from = process.env.MAIL_FROM || 'me@localhost'

export default ({ nodeMailer }: { nodeMailer: typeof NodeMailer }): Mailer => {
  async function send(
    to: string,
    templateName: string,
    variables: Variables
  ): Promise<unknown> {
    const template = (await require('./mailTemplates/' + templateName)).default
    return new Promise((resolve, reject) => {
      const subject = Mustache.render(template.subject, {
        baseUrl,
        ...variables,
      })
      const html = Mustache.render(template.html, { baseUrl, ...variables })
      transporter.sendMail({ from, to, subject, html }, (err, info) =>
        err ? reject(err) : resolve(info)
      )
    })
  }

  const transportOptions: SMTPTransport.Options = {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_USER as string,
      pass: process.env.SMTP_PASSWORD as string,
    },
  }
  const transporter = nodeMailer.createTransport(transportOptions)
  return { send }
}
