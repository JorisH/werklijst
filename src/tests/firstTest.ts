import {createStore, applyMiddleware} from "redux";
import {assert} from "chai";
import * as Immutable from "immutable";
import {Promise} from "es6-promise";
import thunk from "redux-thunk";

var createReducer = (initieelDossierId: number, api: Api) => {
    var initialState = Immutable.Map({
        dossierId: initieelDossierId,
        status: "LOADING",
        boekingsvoorstellen: Immutable.List([])
    });

    return (state = initialState, action) => {
        switch (action.type) {
            case 'FETCH_BOEKINGSVOORSTELLEN':
                return state.set('status', 'LOADING');
            case 'FETCH_BOEKINGSVOORSTELLEN_SUCCESS':
                return state
                    .set('boekingsvoorstellen', Immutable.fromJS(action.boekingsvoorstellen))
                    .set('status', 'READY');
        }

        return state;
    };
};

interface Api {
    fetchBoekingsvoorstellen: Function
}

var testapi = {
    fetchBoekingsvoorstellen: (dossierId) => {
        return new Promise(function (resolve, reject) {
            resolve([
                {'naam': 'voorstel1', 'status': 'NOK'},
                {'naam': 'voorstel2', 'status': 'OK'}
            ]);
        });
    }
};

describe('initiele state', function () {
    var store = createStore(
        createReducer(1, testapi),
        applyMiddleware(thunk)
    );
    var state = store.getState();

    it('bevat een dossierId', function () {
        assert.equal(state.get('dossierId'), 1);
    });

    it('heeft als status "LOADING"', function () {
        assert.equal(state.get('status'), 'LOADING');
    });

    it('de lijst met boekingsvoorstellen is leeg', function () {
        assert.equal((<Immutable.List<any>>state.get('boekingsvoorstellen')).size, 0);
    });
});


// actions
var createFetchBoekingsvoorstellen = dossierId => dispatch => {
    dispatch({
        type: "FETCH_BOEKINGSVOORSTELLEN",
        dossierId: dossierId
    });

    testapi.fetchBoekingsvoorstellen(dossierId)
        .then(boekingsvoorstellen => dispatch(createFetchBoekingsvoorstellenSuccess(boekingsvoorstellen)));
};

var createFetchBoekingsvoorstellenSuccess = (boekingsvoorstellen) => {
    return {
        type: "FETCH_BOEKINGSVOORSTELLEN_SUCCESS",
        boekingsvoorstellen: boekingsvoorstellen
    };
};

var createFetchBoekingsvoorstellenError = (error) => {
    return {
        type: "FETCH_BOEKINGSVOORSTELLEN_ERROR",
        error: error
    };
};

describe('ophalen van boekingsvoorstellen van Api', function () {
    var store = createStore(
        createReducer(1, testapi),
        applyMiddleware(thunk)
    );

    it('initiële boekingsvoorstellen', function (done) {
        store.dispatch(createFetchBoekingsvoorstellen(1));
        setTimeout(() => {
            assert.equal((<Immutable.List<any>>store.getState().get('boekingsvoorstellen')).size, 2);
            assert.equal(store.getState().get('status'), 'READY');
            done();
        }, 10);
    });

    it('andere boekingsvoorstellen', function (done) {
        assert.equal(store.getState().get('status'), 'READY');
        store.dispatch(createFetchBoekingsvoorstellen(1));
        assert.equal(store.getState().get('status'), 'LOADING');
        setTimeout(() => {
            assert.equal((<Immutable.List<any>>store.getState().get('boekingsvoorstellen')).size, 2);
            assert.equal(store.getState().get('status'), 'READY');
            done();
        }, 10);
    });
});
