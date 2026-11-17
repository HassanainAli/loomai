import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>loom<span style={dot}>.</span></Text>
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) by clicking the button below:
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Verify Email
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', padding: '24px 0' }
const container = { backgroundColor: '#050505', borderRadius: '16px', padding: '32px 28px', maxWidth: '480px', margin: '0 auto', border: '1px solid #FF2BD6' }
const brand = { fontSize: '28px', fontWeight: 900 as const, color: '#ffffff', margin: '0 0 24px' }
const dot = { color: '#FACC15' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#ffffff', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#c9c9cf', lineHeight: '1.5', margin: '0 0 20px' }
const link = { color: '#FF2BD6', textDecoration: 'underline' }
const button = {
  backgroundColor: '#FACC15',
  color: '#050505',
  fontWeight: 'bold' as const,
  fontSize: '14px',
  border: '1px solid #FACC15',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#8a8a92', margin: '30px 0 0' }
const darkModeCss = ``
