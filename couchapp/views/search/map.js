function (doc) {
  if (doc.hasOwnProperty('ObjectType') && !doc.IsDeleted) {
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

      case 'Event': {
        emit(doc.Subject, doc.Subject);
      } break;

      case 'Task': {
        var label = doc.Description || doc.Subject;
        emit(label, label);
      }
    }
  }
}
