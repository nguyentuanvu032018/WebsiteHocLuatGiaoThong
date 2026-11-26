export const LICENSE_GROUPS = {
  A: {
    label: 'A / A1',
    codes: ['A', 'A1'],
    vehicle: 'Xe mô tô',
    studyScope: 'Chương I-V',
    chapterOrders: [1, 2, 3, 4, 5]
  },
  B: {
    label: 'B / B1',
    codes: ['B', 'B1'],
    vehicle: 'Ô tô con',
    studyScope: 'Đầy đủ 7 chương',
    chapterOrders: null
  },
  C: {
    label: 'C / C1',
    codes: ['C', 'C1'],
    vehicle: 'Ô tô tải',
    studyScope: 'Đầy đủ 7 chương',
    chapterOrders: null
  }
};

export const getLicenseGroup = (groupCode) => {
  const code = String(groupCode || '').trim().toUpperCase();
  return LICENSE_GROUPS[code] ? { code, ...LICENSE_GROUPS[code] } : null;
};

export const getGroupLicenseTypes = (licenseTypes, groupCode) => {
  const group = getLicenseGroup(groupCode);
  if (!group) return [];
  return licenseTypes.filter((license) => group.codes.includes(String(license.code).toUpperCase()));
};
