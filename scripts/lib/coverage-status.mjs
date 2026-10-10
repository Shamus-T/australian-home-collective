export function coverageStatus(article, products) {
  const issues=[];
  const allowed=new Map(products.filter(p=>p.guidePath===article.guidePath&&p.editorialStatus==='approved').map(p=>[p.id,p]));
  const supporting=new Set(article.supportingProductIds??[]);
  const primaryIds=new Set();
  let covered=0;
  for(const need of article.requiredProductTypes??[]){
    if(!need.label?.trim())issues.push('Unnamed primary product type');
    const ids=need.productIds??[];
    for(const id of ids){
      if(!allowed.has(id))issues.push('Primary product not approved on this article: '+id);
      if(supporting.has(id))issues.push('Accessory cannot satisfy a primary category: '+id);
      primaryIds.add(id);
    }
    if(ids.length&&ids.every(id=>allowed.has(id)&&!supporting.has(id)))covered++;
    if(!ids.length&&!need.gapReason?.trim())issues.push('Missing product type needs an explicit research gap');
  }
  for(const id of supporting)if(!allowed.has(id))issues.push('Supporting product not approved on this article: '+id);
  for(const id of allowed.keys())if(!primaryIds.has(id)&&!supporting.has(id))issues.push('Unreviewed commercial product: '+id);
  if(!['buying','editorial'].includes(article.intent))issues.push('Invalid article intent');
  if(article.intent==='editorial'&&!article.editorialReason?.trim())issues.push('Editorial exception needs a reason');
  if(article.intent==='buying'&&!article.requiredProductTypes?.length)issues.push('Buying article needs a primary product requirement');
  const gaps=(article.requiredProductTypes??[]).filter(n=>!n.productIds?.length);
  const status=article.intent==='editorial'?'editorial':covered===0?'missing-primary':gaps.length?'partial-primary':'primary-present';
  const imageGaps=[...allowed.values()].filter(p=>!p.image).map(p=>p.id);
  const illustrativeImages=[...allowed.values()].filter(p=>/diagram|not a product photograph/i.test(p.image?.credit??'')).map(p=>p.id);
  return {status,primaryProducts:primaryIds.size,supportingProducts:supporting.size,gaps,imageGaps,illustrativeImages,issues};
}
