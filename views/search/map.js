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
      case 'Lead':
      case 'User': {
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

        var na = [];
        if (notEmpty(doc.FirstName)) {
          na.push(doc.FirstName);
        }
        if (notEmpty(doc.LastName)) {
          na.push(doc.LastName);
        }

        var fullName = na.join(' ');
        if (na.length > 1) {
          emit(fullName, fullName);
        }

        while (na.length > 0) {
          emit(na.shift(), fullName);
        }

        if (notEmpty(doc.Company)) {
          var label = notEmpty(fullName) ? doc.Company + ' ('+ fullName + ')' : doc.Company;
          emit(doc.Company, label);
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
