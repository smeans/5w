function (doc) {
  if (doc.hasOwnProperty('ObjectType')) {
    switch (doc.ObjectType) {
      case 'Account':
      case 'Campaign':
      case 'Document':
      case 'Visit_Report__c': {
        emit(doc.Name.toUpperCase(), doc.Name);
      } break;

      case 'Contact':
      case 'Lead': {
        var fullName = doc.FirstName + ' ' + doc.LastName;

        emit(doc.FirstName, fullName);
        emit(doc.LastName, fullName);
      } break;

      case 'Case': {
        emit(doc.CaseNumber, doc.CaseNumber);
      } break;

      case 'Invoice__c': {
        emit(doc.Invoice_Number__c, doc.Invoice_Number__c);
      } break;
    }
  }
}
