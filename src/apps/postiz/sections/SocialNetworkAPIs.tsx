import { Key } from 'lucide-react';
import { Section } from '../../../components/Section';
import { ProviderBlock } from '../../../components/ProviderBlock';
import { FormGroup } from '../../../components/FormGroup';

export const SocialNetworkAPIs = ({ config, handleChange, activeProviders, toggleProvider }: any) => {
    return (
        <Section
            title="3. Social Network APIs"
            icon={Key}
            description="Enable the social networks you want to connect to. Inputs will appear once the provider is toggled on."
            helpLink="https://docs.postiz.com/providers/overview"
        >
            <ProviderBlock title="X (Twitter)" isActive={activeProviders.twitter} onToggle={() => toggleProvider('twitter')}>
                <FormGroup label="X (Twitter) API Key" name="X_API_KEY" value={config.X_API_KEY} onChange={handleChange} helpText="HOW TO GET: developer.x.com -> Developer Portal -> Projects & Apps. Business/Regular: Create an App, get 'API Key and Secret' (Consumer Keys). Requires Basic or Enterprise tier for posting. Free tier has severe limits." helpLink="https://docs.postiz.com/providers/x-twitter" />
                <FormGroup label="X (Twitter) API Secret" name="X_API_SECRET" type="password" value={config.X_API_SECRET} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="LinkedIn" isActive={activeProviders.linkedin} onToggle={() => toggleProvider('linkedin')}>
                <FormGroup label="LinkedIn Client ID" name="LINKEDIN_CLIENT_ID" value={config.LINKEDIN_CLIENT_ID} onChange={handleChange} helpText='HOW TO GET: linkedin.com/developers/apps. Business: Create an app, associate it with your LinkedIn Company Page. Regular: Same process, but you might need to create a dummy company page first. Request access to "Share on LinkedIn" and "Sign In with LinkedIn".' helpLink="https://docs.postiz.com/providers/linkedin" />
                <FormGroup label="LinkedIn Client Secret" name="LINKEDIN_CLIENT_SECRET" type="password" value={config.LINKEDIN_CLIENT_SECRET} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="Facebook" isActive={activeProviders.facebook} onToggle={() => toggleProvider('facebook')}>
                <FormGroup label="Facebook App ID" name="FACEBOOK_APP_ID" value={config.FACEBOOK_APP_ID} onChange={handleChange} helpText="HOW TO GET: developers.facebook.com. Business: Requires Facebook Business Manager verification for public use. Regular: You can use it in 'Development Mode' just for your own account without verification." helpLink="https://docs.postiz.com/providers/facebook" />
                <FormGroup label="Facebook App Secret" name="FACEBOOK_APP_SECRET" type="password" value={config.FACEBOOK_APP_SECRET} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="Instagram" isActive={activeProviders.instagram} onToggle={() => toggleProvider('instagram')}>
                <FormGroup label="Instagram Client ID" name="INSTAGRAM_CLIENT_ID" value={config.INSTAGRAM_CLIENT_ID} onChange={handleChange} helpText="HOW TO GET: developers.facebook.com. Instagram requires setting up a Facebook App first and adding the Instagram Graph API." helpLink="https://docs.postiz.com/providers/instagram" />
                <FormGroup label="Instagram Client Secret" name="INSTAGRAM_CLIENT_SECRET" type="password" value={config.INSTAGRAM_CLIENT_SECRET} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="YouTube" isActive={activeProviders.youtube} onToggle={() => toggleProvider('youtube')}>
                <FormGroup label="YouTube Client ID" name="YOUTUBE_CLIENT_ID" value={config.YOUTUBE_CLIENT_ID} onChange={handleChange} helpText="HOW TO GET: console.cloud.google.com. Business/Regular: Create a project, enable YouTube Data API v3. Create OAuth Client ID (Web Application)." helpLink="https://docs.postiz.com/providers/youtube" />
                <FormGroup label="YouTube Client Secret" name="YOUTUBE_CLIENT_SECRET" type="password" value={config.YOUTUBE_CLIENT_SECRET} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="TikTok" isActive={activeProviders.tiktok} onToggle={() => toggleProvider('tiktok')}>
                <FormGroup label="TikTok Client ID" name="TIKTOK_CLIENT_ID" value={config.TIKTOK_CLIENT_ID} onChange={handleChange} helpText="HOW TO GET: developers.tiktok.com. Business/Regular: Need an approved TikTok Developer account." helpLink="https://docs.postiz.com/providers/tiktok" />
                <FormGroup label="TikTok Client Secret" name="TIKTOK_CLIENT_SECRET" type="password" value={config.TIKTOK_CLIENT_SECRET} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="Pinterest" isActive={activeProviders.pinterest} onToggle={() => toggleProvider('pinterest')}>
                <FormGroup label="Pinterest Client ID" name="PINTEREST_CLIENT_ID" value={config.PINTEREST_CLIENT_ID} onChange={handleChange} helpText="HOW TO GET: developers.pinterest.com. Business/Regular: Create an app to get your App ID and App secret." helpLink="https://docs.postiz.com/providers/pinterest" />
                <FormGroup label="Pinterest Client Secret" name="PINTEREST_CLIENT_SECRET" type="password" value={config.PINTEREST_CLIENT_SECRET} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="Discord" isActive={activeProviders.discord} onToggle={() => toggleProvider('discord')}>
                <FormGroup label="Discord Client ID" name="DISCORD_CLIENT_ID" value={config.DISCORD_CLIENT_ID} onChange={handleChange} helpText="HOW TO GET: discord.com/developers/applications. Business/Regular: Create a New Application. Go to OAuth2 to get Client ID/Secret. Go to Bot section to get the Bot Token." helpLink="https://docs.postiz.com/providers/discord" />
                <FormGroup label="Discord Client Secret" name="DISCORD_CLIENT_SECRET" type="password" value={config.DISCORD_CLIENT_SECRET} onChange={handleChange} />
                <FormGroup label="Discord Bot Token ID" name="DISCORD_BOT_TOKEN_ID" type="password" value={config.DISCORD_BOT_TOKEN_ID} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="Reddit" isActive={activeProviders.reddit} onToggle={() => toggleProvider('reddit')}>
                <FormGroup label="Reddit Client ID" name="REDDIT_CLIENT_ID" value={config.REDDIT_CLIENT_ID} onChange={handleChange} helpText='HOW TO GET: reddit.com/prefs/apps. Business/Regular: Click "are you a developer? create an app". Choose "web app". Use your frontend URL + /api/auth/callback/reddit as the redirect URI.' helpLink="https://docs.postiz.com/providers/reddit" />
                <FormGroup label="Reddit Client Secret" name="REDDIT_CLIENT_SECRET" type="password" value={config.REDDIT_CLIENT_SECRET} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="GitHub" isActive={activeProviders.github} onToggle={() => toggleProvider('github')}>
                <FormGroup label="GitHub Client ID" name="GITHUB_CLIENT_ID" value={config.GITHUB_CLIENT_ID} onChange={handleChange} helpText="HOW TO GET: github.com/settings/applications/new. Business: Create under your Organization settings. Regular: Create under your Personal Developer settings." helpLink="https://docs.postiz.com/providers/overview" />
                <FormGroup label="GitHub Client Secret" name="GITHUB_CLIENT_SECRET" type="password" value={config.GITHUB_CLIENT_SECRET} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="Mastodon" isActive={activeProviders.mastodon} onToggle={() => toggleProvider('mastodon')}>
                <FormGroup label="Mastodon URL" name="MASTODON_URL" placeholder="https://mastodon.social" value={config.MASTODON_URL} onChange={handleChange} helpText="HOW TO GET: Given the decentralized nature, you create this on your specific instance. Example: mastodon.social/settings/applications. Create a new app there." helpLink="https://docs.postiz.com/providers/mastodon" />
                <FormGroup label="Mastodon Client ID" name="MASTODON_CLIENT_ID" value={config.MASTODON_CLIENT_ID} onChange={handleChange} />
                <FormGroup label="Mastodon Client Secret" name="MASTODON_CLIENT_SECRET" type="password" value={config.MASTODON_CLIENT_SECRET} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="Threads" isActive={activeProviders.threads} onToggle={() => toggleProvider('threads')}>
                <FormGroup label="Threads App ID" name="THREADS_APP_ID" value={config.THREADS_APP_ID} onChange={handleChange} helpText="HOW TO GET: developers.facebook.com. Business/Regular: Create an app. Add the 'Threads API' product. You'll need an Instagram account." helpLink="https://docs.postiz.com/providers/threads" />
                <FormGroup label="Threads App Secret" name="THREADS_APP_SECRET" type="password" value={config.THREADS_APP_SECRET} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="Beehiiv" isActive={activeProviders.beehiiv} onToggle={() => toggleProvider('beehiiv')}>
                <FormGroup label="Beehiiv API Key" name="BEEHIIVE_API_KEY" value={config.BEEHIIVE_API_KEY} onChange={handleChange} helpText="HOW TO GET: app.beehiiv.com/settings/api. Need a paid Beehiiv plan to generate API keys." />
                <FormGroup label="Beehiiv Publication ID" name="BEEHIIVE_PUBLICATION_ID" value={config.BEEHIIVE_PUBLICATION_ID} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="Dribbble" isActive={activeProviders.dribbble} onToggle={() => toggleProvider('dribbble')}>
                <FormGroup label="Dribbble Client ID" name="DRIBBBLE_CLIENT_ID" value={config.DRIBBBLE_CLIENT_ID} onChange={handleChange} />
                <FormGroup label="Dribbble Client Secret" name="DRIBBBLE_CLIENT_SECRET" type="password" value={config.DRIBBBLE_CLIENT_SECRET} onChange={handleChange} />
            </ProviderBlock>

            <ProviderBlock title="Slack" isActive={activeProviders.slack} onToggle={() => toggleProvider('slack')}>
                <FormGroup label="Slack Client ID" name="SLACK_ID" value={config.SLACK_ID} onChange={handleChange} />
                <FormGroup label="Slack Client Secret" name="SLACK_SECRET" type="password" value={config.SLACK_SECRET} onChange={handleChange} />
                <FormGroup label="Slack Signing Secret" name="SLACK_SIGNING_SECRET" type="password" value={config.SLACK_SIGNING_SECRET} onChange={handleChange} />
            </ProviderBlock>
        </Section>
    );
};
