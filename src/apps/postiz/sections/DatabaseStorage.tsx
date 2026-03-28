import { Database } from 'lucide-react';
import { Section } from '../../../components/Section';
import { FormGroup } from '../../../components/FormGroup';

export const DatabaseStorage = ({ config, handleChange }: any) => {
    return (
        <Section
            title="2. Database & Image Storage"
            icon={Database}
            description="Toggle between storing files locally on the VM's hard drive or pushing media into a Cloudflare R2 highly available bucket."
            helpLink="https://docs.postiz.com/configuration/r2"
        >
            <FormGroup label="Storage Location" name="STORAGE_PROVIDER" placeholder="local or cloudflare" value={config.STORAGE_PROVIDER} onChange={handleChange} helpText="Type 'local' to use the VM disk, or 'cloudflare' to use R2 buckets." />
            <FormGroup label="Local Upload Path" name="UPLOAD_DIRECTORY" placeholder="/uploads" value={config.UPLOAD_DIRECTORY} onChange={handleChange} helpText="The internal folder path on the Ubuntu VM where local images are saved (Default: /uploads)." />
            <FormGroup label="Public Upload Path" name="NEXT_PUBLIC_UPLOAD_DIRECTORY" placeholder="/uploads" value={config.NEXT_PUBLIC_UPLOAD_DIRECTORY} onChange={handleChange} helpText="The public URL path used by the frontend to serve the uploaded images (Default: /uploads)." />
            <FormGroup label="Cloudflare Account ID" name="CLOUDFLARE_ACCOUNT_ID" value={config.CLOUDFLARE_ACCOUNT_ID} onChange={handleChange} helpText="Your Cloudflare account identifier, located in the right sidebar of the Cloudflare Dashboard." helpLink="https://dash.cloudflare.com" />
            <FormGroup label="R2 Access Key" name="CLOUDFLARE_ACCESS_KEY" type="password" value={config.CLOUDFLARE_ACCESS_KEY} onChange={handleChange} helpText="Generated in your Cloudflare R2 dashboard under 'Manage R2 API Tokens'." />
            <FormGroup label="R2 Secret Key" name="CLOUDFLARE_SECRET_ACCESS_KEY" type="password" value={config.CLOUDFLARE_SECRET_ACCESS_KEY} onChange={handleChange} helpText="The secret key generated alongside your R2 Access Key." />
            <FormGroup label="R2 Bucket Name" name="CLOUDFLARE_BUCKETNAME" value={config.CLOUDFLARE_BUCKETNAME} onChange={handleChange} helpText="The exact name of the bucket you created in Cloudflare R2." />
            <FormGroup label="Public Bucket URL" name="CLOUDFLARE_BUCKET_URL" placeholder="https://...r2.cloudflarestorage.com" value={config.CLOUDFLARE_BUCKET_URL} onChange={handleChange} helpText="The custom domain or public R2.dev URL linked to your bucket." />
        </Section>
    );
};
