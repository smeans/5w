# 5w Library
This is a [CouchApp](https://github.com/couchapp/couchapp) project that is designed to be deployed to a [CouchDB](http://couchdb.apache.org/) server. It also contains the required library files to include in a 5w based client in the `client/` folder.

## CouchApp
The CouchApp contains several views that are used by the 5w library to search and display JSON documents in a CouchDB database.

## 5w Library
The 5w library is a JavaScript library that is designed to simplify the development of applications that manipulate JSON documents in the CouchDB no-sql environment. It is designed as a layer on top of the underlying JSON documents, with metadata that specifies how the documents are meant to be displayed and edited.
### conventions
#### document types
The library is organized around document _types_. To specify a document’s type, the document `_id` must follow a specific format:
```[document_type]_[document_guid]```
The document type should be a valid identifier and may not start with `$5w`. The format of `document_guid` is not specified, but $5w provides a utility method `getNewId()` which returns a standardized document ID given a type name.
Metadata about each document type is stored in a special document with the following document id format:
```$5w_proto_[document_type]```
#### fields
Metadata about individual fields with a JSON document are indexed using the field name. Given a simple document, such as:
```javascript
{
	“_id”: “Customer_0ab800000152318cc56d”,
	“name”: “Alicia Gonzales”
}
```
The document type is `Customer`. It has a single data property, `name`. Metadata about the `name` field exists at the following levels:
* **user** - It is possible for a single user to override the metadata for a given field type. They can change the label, editability, visibility, etc. for only themselves.
* **object** - This sets metadata for a given field at the object type level. This would allow for a different label to be set for a `name` field on a `Customer` object than a `name` field on a `Lead` object, for example.
* **global** - This sets metadata for the field at a system-wide level. Any occurrence of `name` would use the global metadata setting, if it wasn’t overridden at a lower level.
* **default** - This sets metadata for _all_ fields in the system. This is rarely used outside of initial system configuration. This could be used to make all fields read-only by default, for example.
This system is hierarchical, so it is technically possible to have different metadata settings at the `user`, `object`, `global`, and `default` levels. The most-specific setting is always used. If a `user` setting exists for the current user, it will be used in place of an `object` level setting, for example.
#### Document Field List
The 5w system was designed to be easily implemented on top of existing databases. When editing an existing JSON document, the library will attempt to display all fields (other than those beginning with the special $ character). When creating a new document or editing an existing document, it will attempt to display all current fields as well as any fields named in the document _prototype_ `fields` array. This allows fields to be made obsolete without processing possibly thousands of existing documents.
### metadata
Metadata is tracked at the document and field level by 5w.
#### document level
Document level metadata is stored in the special `$5w_proto_[document_type]` document for each document type. These prototypes are created on demand, and are considered to be empty for unknown document types.
* **fields** - An array of field names for the given document type. This will be used when a blank document is created or when editing a document that may not contain all of the fields in the list.
* **allow_create** - This is used to populate the + menu on a document, specifying what types of documents can be linked to the given document type.
* **sort_type** - This specifies the field that should be used to sort this document type in the 5w search list UI.
#### field level
Field-level metadata is maintained in the special `%5w_sms` document. All fields may have the following metadata properties (defined at the levels explained in the conventions/fields section of this document):
* **label** (string) - The text label to be displayed for this field type.
* **hidden** (boolean) - If the field should be hidden from the user.
* **readonly** (boolean) - If the field is read-only (may not be edited).
* **required** (boolean) - If the field value must be provided when editing.
* **type** (list) - The type of the underlying field. This controls how the field is displayed and edited:
	+ **string** - A simple string. Edited using an HTML `input` control.
	+ **choice** - A list of possible values. Edited using an HTML `select` element.
	+ **boolean** - True/false. Edited with an HTML `checkbox` control.
	+ **currency** - Displays the floating point value formatted as US currency.
	+ **datetime** - Displays using a reasonable date/time format. Provides a date/time edit control.
	+ **date** - Displays using a date-only format and date edit control.
	+ **email** - Triggers a `5w_launch_email` event when tapped.
	+ **phone** - Triggers a `5w_launch_phone` event when tapped.
	+ **mobile** - Triggers a `5w_launch_mobile` event when tapped.
	+ **fax** - Prevents any phone-related events from being triggered.
	+ **physical_address** - Triggers a `5w_launch_address` event when tapped.
	+ **mailing_address** - Prevents triggering any address-related events.
	+ **url** - Triggers a `5w_launch_url` event and opens the link in the Cordova in-app browser.
	+ **document_link** - Triggers a `5w_open_object` event when tapped.
	+ **attachments** - Displays the special attachment manager control.
### Library Overview
The 5w library is meant to be instantiated as a singleton and initialized with a valid CouchDB URL reference. It communicates with the client application primarily through triggered global events. The following code snippet shows how a global singleton `$5w` object is initialized and how the `5w_loaded` event is handled:
```javascript
        $(document).on('5w_loaded', function () {
        // display the initial 5w view
        });

      $5w = new $5W('http://couchserver:5984/dbname);
      $5w._init();
```
The `5w_loaded` callback is necessary because the library must load its metadata before it is possible to display any views or fields.
### Views

### Panes
The 5w display system provides a stack-based _pane_ manager. The client application manages its views by calling `pushPane()`, `overlayPane()`, `replacePane()`, and `popPane()`. 
### Extensions
