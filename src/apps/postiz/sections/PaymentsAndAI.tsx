import { Cloud } from 'lucide-react';
import { Section } from '../../../components/Section';
import { FormGroup } from '../../../components/FormGroup';
import { ToggleSwitch } from '../../../components/ToggleSwitch';

export const PaymentsAndAI = ({ config, handleChange }: any) => {
    return (
        <Section
            title="6. Payments, AI & System Instrumentation"
            icon={Cloud}
            description="Global variables for Stripe billing, OpenAI post generation, and Sentry backend error tracking."
            helpLink="https://docs.postiz.com/configuration/stripe"
        >
            <FormGroup label="OpenAI API Key" name="OPENAI_API_KEY" type="password" value={config.OPENAI_API_KEY} onChange={handleChange} helpText="Used for AI content generation in the app. Need a funded account to use API." helpLink="https://platform.openai.com/api-keys" />
            <FormGroup label="Stripe Publishable Key" name="STRIPE_PUBLISHABLE_KEY" value={config.STRIPE_PUBLISHABLE_KEY} onChange={handleChange} helpText="Business: Essential if charging users. Regular: Not needed if you are the only user." helpLink="https://dashboard.stripe.com/apikeys" />
            <FormGroup label="Stripe Secret Key" name="STRIPE_SECRET_KEY" type="password" value={config.STRIPE_SECRET_KEY} onChange={handleChange} helpText="Your Stripe application secret. Highly sensitive." />
            <FormGroup label="Stripe Webhook Signing" name="STRIPE_SIGNING_KEY" type="password" value={config.STRIPE_SIGNING_KEY} onChange={handleChange} helpText="Given when you set up a webhook in Stripe. Verifies payloads." />
            <FormGroup label="Stripe Connect Signing" name="STRIPE_SIGNING_KEY_CONNECT" type="password" value={config.STRIPE_SIGNING_KEY_CONNECT} onChange={handleChange} helpText="Used for automated Stripe Connect payouts to sub-accounts." />
            <FormGroup label="Sentry DSN" name="NEXT_PUBLIC_SENTRY_DSN" placeholder="http://spotlight:8969/stream" value={config.NEXT_PUBLIC_SENTRY_DSN} onChange={handleChange} helpText="Tells the app where to send error and performance monitoring data." />
            <ToggleSwitch label="Sentry Spotlight Enabled" name="SENTRY_SPOTLIGHT" value={config.SENTRY_SPOTLIGHT} onChange={handleChange} helpText="Turn ON to activate Spotlight debugging tools in the frontend console." />
            <FormGroup label="Platform Fee Percentage" name="FEE_AMOUNT" placeholder="0.05" value={config.FEE_AMOUNT} onChange={handleChange} helpText="Percentage (e.g. 0.05 for 5%) taken from users selling services via your white-label instance." />
            <FormGroup label="Max Rate Limit Tokens" name="API_LIMIT" placeholder="30" value={config.API_LIMIT} onChange={handleChange} helpText="Determines API rate-limiting thresholds to avoid abusive traffic spikes." />
            <FormGroup label="Discord Support Server" name="NEXT_PUBLIC_DISCORD_SUPPORT" value={config.NEXT_PUBLIC_DISCORD_SUPPORT} onChange={handleChange} helpText="A link to your agency's Discord server shown inside the main UI for client help." />
            <FormGroup label="Polotno API Key" name="NEXT_PUBLIC_POLOTNO" type="password" value={config.NEXT_PUBLIC_POLOTNO} onChange={handleChange} helpText="API key for the Polotno design editor embedded in the platform." />
        </Section>
    );
};
