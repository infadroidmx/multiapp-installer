import { Shield } from 'lucide-react';
import { Section } from '../../../components/Section';
import { FormGroup } from '../../../components/FormGroup';
import { ToggleSwitch } from '../../../components/ToggleSwitch';

export const UserAuthentication = ({ config, handleChange }: any) => {
    return (
        <Section
            title="4. User Authentication (Authentik SSO)"
            icon={Shield}
            description="If you are delegating user authentication outside of Postiz, define the remote Authentik or SSO provider variables below."
            helpLink="https://docs.postiz.com/configuration/oauth"
        >
            <FormGroup label="SSO Display Name" name="NEXT_PUBLIC_POSTIZ_OAUTH_DISPLAY_NAME" placeholder="Authentik" value={config.NEXT_PUBLIC_POSTIZ_OAUTH_DISPLAY_NAME} onChange={handleChange} helpText="The visual text on the login button (e.g., 'Log in with Authentik')." />
            <FormGroup label="SSO Logo Image URL" name="NEXT_PUBLIC_POSTIZ_OAUTH_LOGO_URL" value={config.NEXT_PUBLIC_POSTIZ_OAUTH_LOGO_URL} onChange={handleChange} helpText="A direct link to the logo icon featured on the SSO button." />
            <ToggleSwitch label="Generic OAuth Enabled" name="POSTIZ_GENERIC_OAUTH" value={config.POSTIZ_GENERIC_OAUTH} onChange={handleChange} helpText="ON: Replaces the native login with a third-party Single Sign-On flow." />
            <FormGroup label="Authorization Server URL" name="POSTIZ_OAUTH_URL" value={config.POSTIZ_OAUTH_URL} onChange={handleChange} helpLink="https://goauthentik.io/docs/providers/oauth2/" helpText="The base URL of your identity provider." />
            <FormGroup label="SSO Auth URL" name="POSTIZ_OAUTH_AUTH_URL" value={config.POSTIZ_OAUTH_AUTH_URL} onChange={handleChange} helpText="The OAuth2 authorization endpoint." />
            <FormGroup label="SSO Token URL" name="POSTIZ_OAUTH_TOKEN_URL" value={config.POSTIZ_OAUTH_TOKEN_URL} onChange={handleChange} helpText="The endpoint where Postiz exchanges authorization codes for access tokens." />
            <FormGroup label="SSO UserInfo URL" name="POSTIZ_OAUTH_USERINFO_URL" value={config.POSTIZ_OAUTH_USERINFO_URL} onChange={handleChange} helpText="The endpoint used to fetch the user profile data." />
            <FormGroup label="SSO Client ID" name="POSTIZ_OAUTH_CLIENT_ID" value={config.POSTIZ_OAUTH_CLIENT_ID} onChange={handleChange} helpText="The OAuth client ID provided by your Single Sign-On provider." />
            <FormGroup label="SSO Client Secret" name="POSTIZ_OAUTH_CLIENT_SECRET" type="password" value={config.POSTIZ_OAUTH_CLIENT_SECRET} onChange={handleChange} helpText="The highly sensitive secret paired with your OAuth Client ID." />
            <FormGroup label="Requested Scopes" name="POSTIZ_OAUTH_SCOPE" placeholder="openid profile email" value={config.POSTIZ_OAUTH_SCOPE} onChange={handleChange} helpText="The specific data scopes Postiz will request (e.g., 'openid profile email')." />
        </Section>
    );
};
