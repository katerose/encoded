#from pyramid.security import (
#    Allow,
#    Authenticated,
#    Deny,
#    Everyone,
#)
from . import root
from .download import ItemWithDocument
from ..contentbase import (
    Collection,
)
from ..schema_utils import (
    load_schema,
)


@root.location('labs')
class Lab(Collection):
    schema = load_schema('lab.json')
    properties = {
        'title': 'Labs',
        'description': 'Listing of ENCODE DCC labs',
    }
    item_links = {
        'awards': [
            {'href': '/awards/{award_uuid}', 'templated': True,
             'repeat': 'award_uuid award_uuids'}
        ]
    }
    item_embedded = set(['awards'])


@root.location('awards')
class Award(Collection):
    schema = load_schema('award.json')
    properties = {
        'title': 'Awards (Grants)',
        'description': 'Listing of awards (aka grants)',
    }


@root.location('antibody-lots')
class AntibodyLots(Collection):
    #schema = load_schema('antibody_lot.json')
    properties = {
        'title': 'Antibodies Registry',
        'description': 'Listing of ENCODE antibodies',
    }
    item_links = {
        'source': {'href': '/sources/{source_uuid}', 'templated': True},
    }
    item_embedded = set(['source'])


@root.location('organisms')
class Organism(Collection):
    schema = load_schema('organism.json')
    properties = {
        'title': 'Organisms',
        'description': 'Listing of all registered organisms',
        'description': 'Listing of sources and vendors for ENCODE material',
    }


@root.location('sources')
class Source(Collection):
    schema = load_schema('source.json')
    properties = {
        'title': 'Sources',
        'description': 'Listing of sources and vendors for ENCODE material',
    }
    item_links = {
        'actions': [
            {'name': 'edit', 'title': 'Edit', 'profile': '/profiles/{item_type}.json', 'method': 'POST', 'href': '', 'templated': True, 'condition': 'permission:edit'},
        ],
    }



@root.location('donors')
class Donor(Collection):
    ## schema = load_schema('donor.json') Doesn't exist yet
    properties = {
        'title': 'Donors',
        'description': 'Listing Biosample Donors',
    }
    item_links = {
        'organism': {'href': '/organisms/{organism_uuid}', 'templated': True},
    }
    item_embedded = set(['organism'])


@root.location('treatments')
class Treatment(Collection):
    ## schema = load_schema('treatment.json') Doesn't exist yet
    properties = {
        'title': 'Treatments',
        'description': 'Listing Biosample Treatments',
    }


@root.location('constructs')
class Construct(Collection):
    properties = {
        'title': 'Constructs',
        'description': 'Listing of Biosample Constructs',
    }
    item_links = {
        'source': {'href': '/sources/{source_uuid}', 'templated': True},
    }
    item_embedded = set(['source'])


@root.location('documents')
class Document(Collection):
    properties = {
        'title': 'Documents',
        'description': 'Listing of Biosample Documents',
    }

    class Item(ItemWithDocument):
        links = {
            'submitter': {'href': '/users/{submitter_uuid}', 'templated': True},
            'lab': {'href': '/labs/{lab_uuid}', 'templated': True},
            'award': {'href': '/awards/{award_uuid}', 'templated': True},
        }
        embedded = set(['submitter', 'lab', 'award'])


@root.location('biosamples')
class Biosample(Collection):
    #schema = load_schema('biosample.json')
    properties = {
        'title': 'Biosamples',
        'description': 'Biosamples used in the ENCODE project',
    }
    item_links = {
        'submitter': {'href': '/users/{submitter_uuid}', 'templated': True},
        'source': {'href': '/sources/{source_uuid}', 'templated': True},
        'lab': {'href': '/labs/{lab_uuid}', 'templated': True},
        'award': {'href': '/awards/{award_uuid}', 'templated': True},
        'donor': {'href': '/donors/{donor_uuid}', 'templated': True},
        'documents': [
            {'href': '/documents/{document_uuid}', 'templated': True, 'repeat': 'document_uuid document_uuids'},
        ],
        'treatments': [
            {'href': '/treatments/{treatment_uuid}', 'templated': True, 'repeat': 'treatment_uuid treatment_uuids'},
        ],
        'constructs': [
            {'href': '/constructs/{construct_uuid}', 'templated': True, 'repeat': 'construct_uuid construct_uuids'},
        ],
    }
    item_embedded = set(['donor', 'submitter', 'lab', 'award', 'source', 'treatments', 'constructs'])


@root.location('targets')
class Target(Collection):
    #schema = load_schema('target.json')
    properties = {
        'title': 'Targets',
        'description': 'Listing of ENCODE3 targets',
    }
    item_links = {
        'organism': {'href': '/organisms/{organism_uuid}', 'templated': True},
        'submitter': {'href': '/users/{submitter_uuid}', 'templated': True},
        'lab': {'href': '/labs/{lab_uuid}', 'templated': True},
        'award': {'href': '/awards/{award_uuid}', 'templated': True},
    }
    item_embedded = set(['organism', 'submitter', 'lab', 'award'])


# The following should really be child collections.
@root.location('validations')
class Validation(Collection):
    #schema = load_schema('validation.json')
    properties = {
        'title': 'Antibody Validations',
        'description': 'Listing of antibody validation documents',
    }

    class Item(ItemWithDocument):
        links = {
            'antibody_lot': {'href': '/antibody-lots/{antibody_lot_uuid}', 'templated': True},
            'target': {'href': '/targets/{target_uuid}', 'templated': True},
            'submitter': {'href': '/users/{submitter_uuid}', 'templated': True},
            'lab': {'href': '/labs/{lab_uuid}', 'templated': True},
            'award': {'href': '/awards/{award_uuid}', 'templated': True},
        }
        embedded = set(['antibody_lot', 'target', 'submitter', 'lab', 'award'])


@root.location('antibodies')
class AntibodyApproval(Collection):
    #schema = load_schema('antibody_approval.json')
    item_type = 'antibody_approval'
    properties = {
        'title': 'Antibody Approvals',
        'description': 'Listing of validation approvals for ENCODE antibodies',
    }
    item_links = {
        'antibody_lot': {'href': '/antibody-lots/{antibody_lot_uuid}', 'templated': True},
        'target': {'href': '/targets/{target_uuid}', 'templated': True},
        'validations': [
            {'href': '/validations/{validation_uuid}', 'templated': True, 'repeat': 'validation_uuid validation_uuids'},
        ],
    }
    item_embedded = set(['antibody_lot', 'target'])


@root.location('platforms')
class Platform(Collection):
    properties = {
        'title': 'Platforms',
        'description': 'Listing of Platforms',
    }


@root.location('libraries')
class Library(Collection):
    properties = {
        'title': 'Libraries',
        'description': 'Listing of Libraries',
    }
    item_links = {
        'biosample': {'href': '/biosamples/{biosample_uuid}', 'templated': True},
        'documents': [
            {'href': '/documents/{document_uuid}', 'templated': True, 'repeat': 'document_uuid document_uuids'},
        ],
    }
    item_embedded = set(['biosample'])


@root.location('assays')
class Assays(Collection):
    properties = {
        'title': 'Assays',
        'description': 'Listing of Assays',
    }


@root.location('replicates')
class Replicates(Collection):
    properties = {
        'title': 'Replicates',
        'description': 'Listing of Replicates',
    }
    item_links = {
        'library': {'href': '/libraries/{library_uuid}', 'templated': True},
        'platform': {'href': '/platforms/{platform_uuid}', 'templated': True},
        'assay': {'href': '/assays/{assay_uuid}', 'templated': True},
    }
    item_embedded = set(['library', 'platform', 'assay'])


@root.location('files')
class Files(Collection):
    properties = {
        'title': 'Files',
        'description': 'Listing of Files',
    }
    item_links = {
        'submitter': {'href': '/users/{submitter_uuid}', 'templated': True},
        'lab': {'href': '/labs/{lab_uuid}', 'templated': True},
        'award': {'href': '/awards/{award_uuid}', 'templated': True},
    }
    item_embedded = set(['submitter', 'lab', 'award'])


@root.location('experiments')
class Experiments(Collection):
    properties = {
        'title': 'Experiments',
        'description': 'Listing of Experiments',
    }
    item_links = {
        'submitter': {'href': '/users/{submitter_uuid}', 'templated': True},
        'lab': {'href': '/labs/{lab_uuid}', 'templated': True},
        'award': {'href': '/awards/{award_uuid}', 'templated': True},
        'files': [
            {'href': '/files/{file_uuid}', 'templated': True, 'repeat': 'file_uuid file_uuids'},
        ],
        'replicates': [
            {'href': '/replicates/{replicate_uuid}', 'templated': True, 'repeat': 'replicate_uuid replicate_uuids'},
        ],
    }
    item_embedded = set(['files', 'replicates', 'submitter', 'lab', 'award'])
