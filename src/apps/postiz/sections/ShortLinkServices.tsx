import { Link as LinkIcon } from 'lucide-react';
import { Section } from '../../../components/Section';
import { FormGroup } from '../../../components/FormGroup';
import { ToggleSwitch } from '../../../components/ToggleSwitch';

export const ShortLinkServices = ({ config, handleChange }: any) => {
    return (
        <Section
            title="5. Short Link Services"
            icon={LinkIcon}
            description="Integrate services like Dub.co or Kutt to automatically shorten links generated within social media posts."
            helpLink="https://docs.postiz.com/configuration/short-links"
        >
            <FormGroup label="Dub.co Access Token" name="DUB_TOKEN" type="password" value={config.DUB_TOKEN} onChange={handleChange} helpLink="https://dub.co/docs/api-reference/tokens" helpText="An API token generated from your short link provider." />
            <FormGroup label="Dub API Endpoint" name="DUB_API_ENDPOINT" placeholder="https://api.dub.co" value={config.DUB_API_ENDPOINT} onChange={handleChange} helpText="The base API endpoint standard for short links." />
            <FormGroup label="Dub Hosted Domain" name="DUB_SHORT_LINK_DOMAIN" placeholder="dub.sh" value={config.DUB_SHORT_LINK_DOMAIN} onChange={handleChange} helpText="The actual domain used for rendering shortened URLs (e.g., dub.sh)." />

            <ToggleSwitch label="Run Background Cron" name="RUN_CRON" value={config.RUN_CRON} onChange={handleChange} helpText="ON: Activates the continuous background cron job to manage scheduling. Highly recommended." />
            <FormGroup label="Server Port" name="POSTIZ_PORT" placeholder="4007" value={config.POSTIZ_PORT} onChange={handleChange} helpText="The internal VM port Postiz runs on (Default 4007)." />
            <div className="hidden lg:block col-span-2 xl:col-span-3"></div>

            <FormGroup label="Short.io Secret Key" name="SHORT_IO_SECRET_KEY" type="password" value={config.SHORT_IO_SECRET_KEY} onChange={handleChange} helpText="Leave blank if using Dub or LinkDrip." />
            <div className="hidden lg:block col-span-2"></div>

            <FormGroup label="Kutt API Key" name="KUTT_API_KEY" type="password" value={config.KUTT_API_KEY} onChange={handleChange} helpText="Leave blank if using Dub or LinkDrip." />
            <FormGroup label="Kutt API Endpoint" name="KUTT_API_ENDPOINT" placeholder="https://kutt.it/api/v2" value={config.KUTT_API_ENDPOINT} onChange={handleChange} helpText="API Target for Kutt infrastructure." />
            <FormGroup label="Kutt Hosted Domain" name="KUTT_SHORT_LINK_DOMAIN" placeholder="kutt.it" value={config.KUTT_SHORT_LINK_DOMAIN} onChange={handleChange} helpText="The domain serving Kutt URL shortening." />

            <FormGroup label="LinkDrip API Key" name="LINK_DRIP_API_KEY" type="password" value={config.LINK_DRIP_API_KEY} onChange={handleChange} helpText="Leave blank if using Dub." />
            <FormGroup label="LinkDrip Endpoint" name="LINK_DRIP_API_ENDPOINT" placeholder="https://api.linkdrip.com/v1/" value={config.LINK_DRIP_API_ENDPOINT} onChange={handleChange} helpText="LinkDrip API base path." />
            <FormGroup label="LinkDrip Domain" name="LINK_DRIP_SHORT_LINK_DOMAIN" placeholder="dripl.ink" value={config.LINK_DRIP_SHORT_LINK_DOMAIN} onChange={handleChange} helpText="The domain used by LinkDrip." />
        </Section>
    );
};
