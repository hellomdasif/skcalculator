import { handler as netlifyHandler } from '../netlify/functions/fabric-types.js';
import { adaptNetlifyHandler } from './_netlifyAdapter.js';

export default adaptNetlifyHandler(netlifyHandler);
