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
        // ignore bad data: N/A, ?, and ???

        var notEmpty = function (field) {
          if (!field) {
            return false;
          }

          var normalizedField = field.trim().toLowerCase();
          switch (normalizedField) {
            case 'n/a':
            case '?':
            case '??':
            case '???':
            case '[not provided]':
            case '-unknown': {
              return false;
            }
          }

          return true;
        };


        var fullName = doc.FirstName + ' ' + doc.LastName;

        if (notEmpty(doc.FirstName)) {
          emit(doc.FirstName, fullName);
        }
        
        if (notEmpty(doc.LastName)) {
          emit(doc.LastName, fullName);
        }
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
