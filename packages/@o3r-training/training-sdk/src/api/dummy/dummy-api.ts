import { Flight } from '../../models/base/flight/index';
import { reviveFlight } from '../../models/base/flight/flight.reviver';
import { Api, ApiClient, ApiTypes, computePiiParameterTokens,  RequestBody, RequestMetadata, } from '@ama-sdk/core';

/** Parameters object to DummyApi's dummyGet function */
export interface DummyApiDummyGetRequestData {
}
export class DummyApi implements Api {

  /** API name */
  public static readonly apiName = 'DummyApi';

  /** @inheritDoc */
  public readonly apiName = DummyApi.apiName;

  /** Tokens of the parameters containing PII */
  public readonly piiParamTokens: { [key: string]: string } = computePiiParameterTokens([]);

  /** @inheritDoc */
  public client: ApiClient;

  /**
   * Initialize your interface
   *
   * @param apiClient Client used to process call to the API
   */
  constructor(apiClient: ApiClient) {
    this.client = apiClient;
  }

  /**
   * Dummy get
   * Dummy get
   * @param data Data to provide to the API call
   * @param metadata Metadata to pass to the API call
   */
  public async dummyGet(data: DummyApiDummyGetRequestData, metadata?: RequestMetadata<string, 'application/json'>): Promise<Flight> {
    const queryParamsProperties = {};
    const queryParams = this.client.stringifyQueryParams(queryParamsProperties);
    const metadataHeaderAccept = metadata?.headerAccept || 'application/json';
    const headers: { [key: string]: string | undefined } = {
      'Content-Type': metadata?.headerContentType || 'application/json',
      ...(metadataHeaderAccept ? {'Accept': metadataHeaderAccept} : {})
    };

    let body: RequestBody = '';
    const basePath = `${this.client.options.basePath}/dummy`;
    const tokenizedUrl = `${this.client.options.basePath}/dummy`;
    const tokenizedOptions = this.client.tokenizeRequestOptions(tokenizedUrl, queryParams, this.piiParamTokens, data);

    const requestOptions = {
      headers,
      method: 'GET',
      basePath,
      queryParams,
      body: body || undefined,
      metadata,
      tokenizedOptions,
      api: this
    };

    const options = await this.client.getRequestOptions(requestOptions);
    const url = options.basePath;

    const ret = this.client.processCall<Flight>(url, options, ApiTypes.DEFAULT, DummyApi.apiName, { 200: reviveFlight } , 'dummyGet');
    return ret;
  }

}
