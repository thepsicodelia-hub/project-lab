import { parseState } from './data.js';

export class WorkspaceRepository {
  constructor(client, workspaceId) { this.client=client; this.id=workspaceId; this.revision=null; }
  async snapshot() {
    const {data,error}=await this.client.from('workspace_data').select('data,revision').eq('workspace_id',this.id).single();
    if(error) throw error;
    const state=parseState(data.data);
    return {state,revision:data.revision};
  }
  async load() {
    const result=await this.snapshot();
    this.revision=result.revision;
    return result.state;
  }
  async save(input) {
    if(this.revision===null) throw new Error('Carregue o estúdio antes de salvar.');
    const state=parseState(input);
    const {data,error}=await this.client.rpc('save_workspace',{p_workspace:this.id,p_revision:this.revision,p_data:state});
    if(error) {
      if(error.message?.includes('revision_conflict')) {
        const conflict=new Error('Outra pessoa atualizou o estúdio. Guarde seu rascunho e carregue a versão mais recente antes de repetir a alteração.');
        conflict.code='CONFLICT'; throw conflict;
      }
      throw error;
    }
    this.revision=data;
    return state;
  }
  async hasUpdates() {
    const {data,error}=await this.client.from('workspace_data').select('revision').eq('workspace_id',this.id).single();
    if(error) throw error;
    return data.revision!==this.revision;
  }
}
