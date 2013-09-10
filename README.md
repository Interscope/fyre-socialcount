fyre-socialcount
================
Livefyre + Backbone Social Counter Apps using Livefyre [Content Count](https://github.com/Livefyre/livefyre-docs/wiki/Content-Count-API) and [Curate Count](https://github.com/Livefyre/livefyre-docs/wiki/Curation-Count-API-(DRAFT) ) APIs ([Heat Index](https://github.com/Livefyre/livefyre-docs/wiki/Heat-Index-API) TBD). 




##Interscope Dependencies
These Interscope specific dependencies are used by the base View. They are defined in http://cache.umusic.com/_global/js/iga/iga.require.main.js 

iga/utils/iga.utils.js - general purpose global utility functions (Not included in built module)
iga/utils/iga.backbone.custom.js - adds backbone event triggers
lib/backbone.nestedmodel.js - fork of https://github.com/afeld/backbone-nested with scoped jQuery reference for Drupal compatability
lib/iga.require.text.js - required for non-built x-domain deployments only hgn! templates
