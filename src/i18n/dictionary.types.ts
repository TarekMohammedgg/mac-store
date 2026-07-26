export interface Dictionary {
  brand: {
    name: string;
  };
  common: {
    search: string;
    loading: string;
    back: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    add: string;
    create: string;
    duplicate: string;
    reset: string;
    remove: string;
    close: string;
    retry: string;
    yes: string;
    no: string;
    all: string;
    optional: string;
    required: string;
    none: string;
    resetFilters: string;
    tryAdjustingFilters: string;
    backToCatalog: string;
    showPassword: string;
    hidePassword: string;
  };
  footer: {
    notice: string;
    socialLinks: string;
  };
  nav: {
    home: string;
    devices: string;
    accessories: string;
    admin: string;
    signOut: string;
    signIn: string;
    dashboard: string;
    products: string;
    sales: string;
    analytics: string;
    settings: string;
  };
  home: {
    badge: string;
    title: string;
    titleAccent: string;
    description: string;
    browseDevices: string;
    browseAccessories: string;
    usedDevices: string;
    accessories: string;
    latestDevices: string;
    latestDevicesHint: string;
    viewAll: string;
    accessoriesInStock: string;
    accessoriesInStockHint: string;
    empty: {
      noDevices: string;
      noDevicesHint: string;
      noAccessories: string;
      noAccessoriesHint: string;
    };
  };
  products: {
    pageTitle: string;
    pageDescription: string;
    title: string;
    sortBy: string;
    sort: {
      newest: string;
      oldest: string;
      priceAsc: string;
      priceDesc: string;
      model: string;
    };
    filters: {
      category: string;
      allCategories: string;
      condition: string;
      anyCondition: string;
      availability: string;
      anyAvailability: string;
      cpu: string;
      anyCpu: string;
      minPrice: string;
      anyMinPrice: string;
      maxPrice: string;
      anyMaxPrice: string;
      minRam: string;
      anyRam: string;
      minStorage: string;
      anyStorage: string;
    };
    searchPlaceholder: string;
    activeFilters: (count: number) => string;
    moreFilters: string;
    fewerFilters: string;
    empty: {
      title: string;
      description: string;
    };
    count: (count: number) => string;
  };
  product: {
    backToDevices: string;
    inStockHint: string;
    description: string;
    specifications: string;
    related: string;
    specs: {
      cpu: string;
      ram: string;
      storage: string;
      battery: string;
      cycleCount: string;
      condition: string;
    };
  };
  accessories: {
    pageTitle: string;
    pageDescription: string;
    sortBy: string;
    sort: {
      newest: string;
      oldest: string;
      priceAsc: string;
      priceDesc: string;
      name: string;
    };
    filters: {
      category: string;
      allCategories: string;
      minPrice: string;
      anyMinPrice: string;
      maxPrice: string;
      anyMaxPrice: string;
      inStockOnly: string;
    };
    searchPlaceholder: string;
    activeFilters: (count: number) => string;
    empty: {
      title: string;
      description: string;
    };
    count: (count: number) => string;
  };
  accessory: {
    backToAccessories: string;
    inStock: string;
    outOfStock: string;
    unitsAvailable: string;
    description: string;
    stock: string;
    availableUnits: string;
    related: string;
  };
  login: {
    title: string;
    description: string;
    email: string;
    password: string;
    submit: string;
    submitting: string;
    signUp: string;
    signingUp: string;
    signUpTitle: string;
    signUpDescription: string;
    noAccount: string;
    hasAccount: string;
    backLink: string;
    success: string;
    failed: string;
  };
  admin: {
    signedInAs: string;
    dashboardTitle: string;
    dashboardHint: string;
    newDevice: string;
    newAccessory: string;
    editDevice: string;
    editAccessory: string;
    addDevice: string;
    addDeviceHint: string;
    addAccessory: string;
    addAccessoryHint: string;
    columns: {
      thumbnail: string;
      model: string;
      name: string;
      category: string;
      condition: string;
      status: string;
      stock: string;
      price: string;
      actions: string;
    };
    actions: {
      edit: string;
      duplicate: string;
      delete: string;
      increaseStock: string;
      decreaseStock: string;
    };
    search: {
      devicesPlaceholder: string;
      accessoriesPlaceholder: string;
    };
    empty: {
      noDevices: string;
      noAccessories: string;
    };
    confirm: {
      deleteDeviceTitle: string;
      deleteDeviceDescription: (model: string) => string;
      deleteAccessoryTitle: string;
      deleteAccessoryDescription: (name: string) => string;
    };
    notFound: {
      device: string;
      accessory: string;
      backToProducts: string;
      backToAccessories: string;
    };
    stats: {
      totalDevices: string;
      totalAccessories: string;
      deviceValue: string;
      accessoryValue: string;
      devicesHint: (available: number, sold: number) => string;
      accessoriesHint: (units: number) => string;
      deviceValueHint: string;
      accessoryValueHint: string;
    };
    recentDevices: string;
    recentAccessories: string;
    recentActivity: string;
    noActivity: string;
  };
  sales: {
    title: string;
    hint: string;
    formTitle: string;
    formHint: string;
    recentTitle: string;
    recentHint: string;
    submit: string;
    emptyProducts: string;
    emptyAccessories: string;
    emptyRecent: string;
    fields: {
      itemType: string;
      item: string;
      listPrice: string;
      salePrice: string;
      quantity: string;
      soldAt: string;
      paymentMethod: string;
      notes: string;
    };
    placeholders: {
      item: string;
      notes: string;
    };
    itemTypes: {
      product: string;
      accessory: string;
    };
    payments: {
      cash: string;
      card: string;
      transfer: string;
      other: string;
    };
    preview: {
      revenue: string;
      cost: string;
      profit: string;
    };
    columns: {
      item: string;
      listPrice: string;
      salePrice: string;
      profit: string;
      when: string;
    };
    errors: {
      itemRequired: string;
      invalidPrice: string;
      invalidQty: string;
    };
    availableStock: (count: number) => string;
  };
  analytics: {
    title: string;
    hint: string;
    empty: string;
    periodDays: (days: number) => string;
    units: (count: number) => string;
    kpi: {
      revenue: string;
      revenueHint: string;
      cost: string;
      costHint: string;
      profit: string;
      profitHint: string;
      margin: string;
      marginHint: string;
      unitsSold: string;
      unitsSoldHint: string;
      aov: string;
      aovHint: (units: number) => string;
    };
    charts: {
      revenueTrend: string;
      revenueTrendHint: string;
      topRevenue: string;
      topRevenueHint: string;
      topUnits: string;
      topUnitsHint: string;
      categoryMix: string;
      categoryMixHint: string;
      paymentMix: string;
      paymentMixHint: string;
      slowMovers: string;
      slowMoversHint: string;
      slowMoversOk: string;
      recentSales: string;
      recentSalesHint: string;
    };
    sortBy: string;
    sort: {
      newest: string;
      oldest: string;
      profitDesc: string;
      profitAsc: string;
      priceDesc: string;
      priceAsc: string;
    };
    columns: {
      item: string;
      type: string;
      qty: string;
      listPrice: string;
      salePrice: string;
      profit: string;
      amount: string;
      when: string;
    };
    itemTypes: {
      product: string;
      accessory: string;
    };
    payments: {
      cash: string;
      card: string;
      transfer: string;
      other: string;
    };
  };
  form: {
    addDevice: string;
    saveDevice: string;
    addAccessory: string;
    saveAccessory: string;
    sections: {
      basic: string;
      hardware: string;
      specifications: string;
      listing: string;
      internal: string;
      images: string;
      availability: string;
    };
    fields: {
      model: string;
      serialNumber: string;
      category: string;
      condition: string;
      availability: string;
      price: string;
      cpu: string;
      ram: string;
      storage: string;
      storageType: string;
      batteryHealth: string;
      cycleCount: string;
      name: string;
      quantity: string;
      description: string;
      purchaseDate: string;
      inventoryDate: string;
      internalNotes: string;
      specKey: string;
      specValue: string;
      availabilitySwitchLabel: string;
      availabilitySwitchHint: string;
    };
    placeholders: {
      model: string;
      serialNumber: string;
      cpu: string;
      ram: string;
      storage: string;
      batteryHealth: string;
      cycleCount: string;
      name: string;
      description: string;
      internalNotes: string;
      specKey: string;
      specValue: string;
    };
    upload: {
      prompt: string;
      hint: (remaining: number) => string;
      addImages: string;
      dragToReorder: string;
      errorFormat: (name: string) => string;
      errorLimit: (max: number) => string;
      errorSize: (name: string) => string;
      errorConvert: (name: string) => string;
    };
    cover: string;
    addSpec: string;
    reviewFields: string;
  };
  settings: {
    title: string;
    hint: string;
    store: {
      title: string;
      description: string;
      storeName: string;
      storeDescription: string;
      contactEmail: string;
      currency: string;
      showSerial: string;
      showSerialHint: string;
      socialLinks: string;
      socialLinksHint: string;
      socialPlatform: string;
      socialLabel: string;
      socialUrl: string;
      addSocialLink: string;
      removeSocialLink: string;
      reset: string;
      save: string;
    };
    socialPlatforms: {
      facebook: string;
      whatsapp: string;
      instagram: string;
      x: string;
      youtube: string;
      telegram: string;
      tiktok: string;
      linkedin: string;
      other: string;
    };
    account: {
      title: string;
      description: string;
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
      update: string;
    };
    data: {
      title: string;
      description: string;
      sampleHint: string;
      addSample: string;
    };
    storage: {
      title: string;
      description: string;
    };
  };
  availability: {
    available: string;
    reserved: string;
    sold: string;
    unavailable: string;
    inStock: string;
    outOfStock: string;
  };
  conditions: {
    new: string;
    'like-new': string;
    excellent: string;
    good: string;
    fair: string;
  };
  productCategories: {
    'macbook-air': string;
    'macbook-pro': string;
    imac: string;
    'mac-mini': string;
    'mac-studio': string;
    'mac-pro': string;
    ipad: string;
    'ipad-pro': string;
    'ipad-air': string;
    'ipad-mini': string;
    iphone: string;
    'apple-watch': string;
    airpods: string;
    other: string;
  };
  accessoryCategories: {
    chargers: string;
    cables: string;
    mice: string;
    keyboards: string;
    monitors: string;
    cases: string;
    audio: string;
    adapters: string;
    stands: string;
    storage: string;
    other: string;
  };
  storageTypes: {
    SSD: string;
    HDD: string;
  };
  theme: {
    label: string;
    light: string;
    dark: string;
    system: string;
  };
  language: {
    label: string;
    switchTo: string;
  };
  toast: {
    deviceAdded: string;
    deviceUpdated: string;
    deviceRemoved: string;
    deviceDuplicated: string;
    accessoryAdded: string;
    accessoryUpdated: string;
    accessoryRemoved: string;
    accessoryDuplicated: string;
    saleRecorded: string;
    saleFailed: string;
    stockUpdateFailed: string;
    settingsSaved: string;
    settingsReset: string;
    passwordUpdated: string;
    passwordUpdateFailed: string;
    sampleAdded: string;
    duplicateFailed: string;
    deleteFailed: string;
    saveFailed: (kind: string) => string;
  };
  errors: {
    notFoundTitle: string;
    notFoundDescription: string;
    globalTitle: string;
    globalDescription: string;
    configTitle: string;
    configDescription: string;
    networkTitle: string;
    networkDescription: string;
  };
}
