(function () {
  const allowedTypes = new Set(['cannabis_flower', 'cannabis_live_plant']);

  function keepPlantImagesOnly(profile) {
    if (!profile || typeof profile !== 'object') return profile;
    const images = Array.isArray(profile.images)
      ? profile.images.filter((image) => image?.image_url && allowedTypes.has(String(image.visual_type || '').toLowerCase()))
      : [];
    return { ...profile, images };
  }

  const originalResearchMarkup = researchMarkup;
  researchMarkup = function (profile) {
    return originalResearchMarkup(keepPlantImagesOnly(profile));
  };

  const originalRenderResearchPreview = renderResearchPreview;
  renderResearchPreview = function (profile) {
    return originalRenderResearchPreview(keepPlantImagesOnly(profile));
  };
})();
