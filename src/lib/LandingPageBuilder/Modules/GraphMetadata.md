```txt
[HashRouter: #blog]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ GraphMetadataNode (ID: "blog:article-module:main")     │ <── Terikat ke LandingPageBuilder
│ - element: <section class="article-module-container">  │
└────────────────────────────────────────────────────────┘
       │
       ├─► [Keturunan Resmi 1: Builder Bersarang]
       │   ┌──────────────────────────────────────────────────┐
       │   │ GraphMetadataNode (ID: "blog:form-builder:001")  │ <── Hasil didikan .adopt() / Context
       │   │ - parentId: "blog:article-module:main"           │
       │   │ - element: <form class="form-container">         │
       │   └──────────────────────────────────────────────────┘
       │         │
       │         └─► [Keturunan Mikro: Multi-Instance Satuan]
       │             ┌───────────────────────────────────────────────────────────┐
       │             │ GraphMetadataNode (ID: "blog:input-component:instance-1") │
       │             │ - parentId: "blog:form-builder:001"                       │
       │             │ - element: <input type="text">                            │
       │             └───────────────────────────────────────────────────────────┘
       │
       └─► [Keturunan Pasif 2: Plain HTML dari DomRenderer]
           ┌──────────────────────────────────────────────────┐
           │ GraphMetadataNode (ID: "blog:plain-html:banner") │ <── Elemen statis tanpa builder kustom
           │ - parentId: "blog:article-module:main"           │
           │ - element: <div class="promo-banner">            │
           │ - builderName: null                              │
           └──────────────────────────────────────────────────┘

```
